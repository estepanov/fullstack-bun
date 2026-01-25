#!/usr/bin/env bash
set -euo pipefail

real_bun="$(command -v bun)"
if [[ -z "${real_bun}" ]]; then
  echo "bun not found on PATH" >&2
  exit 1
fi

if [[ "${BUN_WRAPPER_LOG:-}" == "1" ]]; then
  {
    echo "----"
    date
    echo "pwd: $(pwd)"
    echo "args: $*"
    env | sort
  } >> /tmp/bun-wrapper.log
fi

if [[ "${BUN_WRAPPER:-}" == "1" ]]; then
  exec "${real_bun}" "$@"
fi

if [[ $# -eq 0 || "$1" != "test" ]]; then
  exec "${real_bun}" "$@"
fi

test_args=("${@:2}")
test_path=""
test_index=-1
inspect_arg=""

if [[ -n "${BUN_INSPECT_BRK:-}" ]]; then
  inspect_arg="--inspect-brk"
elif [[ -n "${BUN_INSPECT_WAIT:-}" ]]; then
  inspect_arg="--inspect-wait"
elif [[ -n "${BUN_INSPECT_PORT:-}" ]]; then
  inspect_arg="--inspect=${BUN_INSPECT_PORT}"
elif [[ -n "${BUN_INSPECT:-}" || -n "${VSCODE_INSPECTOR_OPTIONS:-}" ]]; then
  inspect_arg="--inspect"
fi

for i in "${!test_args[@]}"; do
  arg="${test_args[$i]}"
  if [[ "${arg}" == "--" || "${arg}" == -* ]]; then
    continue
  fi
  if [[ -f "${arg}" || -d "${arg}" ]]; then
    test_path="${arg}"
    test_index=$i
    break
  fi
done

if [[ -z "${test_path}" ]]; then
  exec "${real_bun}" "$@"
fi

abs_path="$("${real_bun}" -e 'import path from "node:path"; console.log(path.resolve(process.argv[1]));' -- "${test_path}")"

repo_root="$(pwd)"
dir="$(dirname "${abs_path}")"
pkg_dir=""

while [[ "${dir}" != "/" && "${dir}" != "${repo_root}" ]]; do
  if [[ -f "${dir}/package.json" ]]; then
    pkg_dir="${dir}"
    break
  fi
  dir="$(dirname "${dir}")"
done

if [[ -z "${pkg_dir}" ]]; then
  exec "${real_bun}" "$@"
fi

rel_path="$("${real_bun}" -e 'import path from "node:path"; console.log(path.relative(process.argv[2], process.argv[1]));' -- "${abs_path}" "${pkg_dir}")"

test_args[${test_index}]="${rel_path}"

cd "${pkg_dir}"
script_test="$("${real_bun}" -e 'import fs from "node:fs"; const file = process.argv[1]; let script = ""; try { const pkg = JSON.parse(fs.readFileSync(file, "utf8")); script = pkg?.scripts?.test ?? ""; } catch {} console.log(script);' -- "${pkg_dir}/package.json")"

script_tokens="$("${real_bun}" -e "$(cat <<'BUN'
const script = process.argv[1] ?? "";
const splitArgs = (str) => {
  const args = [];
  let cur = "";
  let quote = null;
  let escape = false;
  for (const ch of str) {
    if (escape) {
      cur += ch;
      escape = false;
      continue;
    }
    if (ch === "\\" && quote !== "'") {
      escape = true;
      continue;
    }
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === "'" || ch === "\"") {
      quote = ch;
      continue;
    }
    if (ch.trim() === "") {
      if (cur) {
        args.push(cur);
        cur = "";
      }
      continue;
    }
    cur += ch;
  }
  if (cur) args.push(cur);
  return args;
};

const tokens = script ? splitArgs(script) : [];
console.log(tokens.join("\n"));
BUN
)" -- "${script_test}")"

script_args=()
if [[ -n "${script_tokens}" ]]; then
  while IFS= read -r line; do
    [[ -n "${line}" ]] && script_args+=("${line}")
  done <<< "${script_tokens}"
fi

if [[ ${#script_args[@]} -ge 2 && "${script_args[0]}" == "bun" && "${script_args[1]}" == "test" ]]; then
  script_extra=("${script_args[@]:2}")
  if [[ -n "${inspect_arg}" ]]; then
    exec "${real_bun}" test "${inspect_arg}" "${script_extra[@]}" "${test_args[@]}"
  fi
  exec "${real_bun}" test "${script_extra[@]}" "${test_args[@]}"
fi

if [[ -n "${script_test}" ]]; then
  exec env BUN_WRAPPER=1 "${real_bun}" run test -- "${test_args[@]}"
fi

if [[ -n "${inspect_arg}" ]]; then
  exec "${real_bun}" test "${inspect_arg}" "${test_args[@]}"
fi
exec "${real_bun}" test "${test_args[@]}"
