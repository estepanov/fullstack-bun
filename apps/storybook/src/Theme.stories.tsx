import type { Meta, StoryObj } from "@storybook/react";

const ThemeColors = () => {
  const colorGroups = {
    Brand: [
      {
        name: "Primary",
        variable: "var(--primary)",
        foreground: "var(--primary-foreground)",
      },
      {
        name: "Secondary",
        variable: "var(--secondary)",
        foreground: "var(--secondary-foreground)",
      },
      {
        name: "Accent",
        variable: "var(--accent)",
        foreground: "var(--accent-foreground)",
      },
      { name: "Success", variable: "var(--success)", foreground: "white" },
      { name: "Info", variable: "var(--info)", foreground: "white" },
      { name: "Warning", variable: "var(--warning)", foreground: "white" },
      { name: "Destructive", variable: "var(--destructive)", foreground: "white" },
    ],
    Base: [
      {
        name: "Background",
        variable: "var(--background)",
        foreground: "var(--foreground)",
      },
      {
        name: "Foreground",
        variable: "var(--foreground)",
        foreground: "var(--background)",
      },
      { name: "Card", variable: "var(--card)", foreground: "var(--card-foreground)" },
      {
        name: "Popover",
        variable: "var(--popover)",
        foreground: "var(--popover-foreground)",
      },
      { name: "Muted", variable: "var(--muted)", foreground: "var(--muted-foreground)" },
    ],
    System: [
      { name: "Border", variable: "var(--border)", foreground: "var(--foreground)" },
      { name: "Input", variable: "var(--input)", foreground: "var(--foreground)" },
      { name: "Ring", variable: "var(--ring)", foreground: "var(--foreground)" },
    ],
    Charts: [
      { name: "Chart 1", variable: "var(--chart-1)", foreground: "white" },
      { name: "Chart 2", variable: "var(--chart-2)", foreground: "white" },
      { name: "Chart 3", variable: "var(--chart-3)", foreground: "white" },
      { name: "Chart 4", variable: "var(--chart-4)", foreground: "white" },
      { name: "Chart 5", variable: "var(--chart-5)", foreground: "white" },
    ],
    Sidebar: [
      {
        name: "Sidebar",
        variable: "var(--sidebar)",
        foreground: "var(--sidebar-foreground)",
      },
      {
        name: "Sidebar Primary",
        variable: "var(--sidebar-primary)",
        foreground: "var(--sidebar-primary-foreground)",
      },
      {
        name: "Sidebar Accent",
        variable: "var(--sidebar-accent)",
        foreground: "var(--sidebar-accent-foreground)",
      },
      {
        name: "Sidebar Border",
        variable: "var(--sidebar-border)",
        foreground: "var(--sidebar-foreground)",
      },
    ],
  };

  return (
    <div className="space-y-12 p-8">
      <div>
        <h2 className="mb-6 text-2xl font-bold">Theme Colors</h2>
        <div className="grid gap-8">
          {Object.entries(colorGroups).map(([group, colors]) => (
            <div key={group}>
              <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {group}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {colors.map((color) => (
                  <div key={color.name} className="flex flex-col gap-2">
                    <div
                      className="h-24 w-full rounded-lg border shadow-sm transition-all hover:scale-105"
                      style={{ backgroundColor: color.variable }}
                    >
                      <div
                        className="flex h-full items-center justify-center p-2 text-center text-xs font-semibold"
                        style={{ color: color.foreground }}
                      >
                        Sample Text
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{color.name}</span>
                      <code className="text-[10px] text-muted-foreground">
                        {color.variable}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-bold">Border Radius</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[
            { name: "Small", class: "rounded-sm" },
            { name: "Medium", class: "rounded-md" },
            { name: "Large (Default)", class: "rounded-lg" },
            { name: "XL", class: "rounded-xl" },
            { name: "Full", class: "rounded-full" },
          ].map((radius) => (
            <div key={radius.name} className="flex flex-col gap-2">
              <div
                className={`h-24 w-full bg-primary ${radius.class} flex items-center justify-center text-primary-foreground shadow-sm`}
              >
                {radius.name}
              </div>
              <code className="text-[10px] text-muted-foreground text-center">
                {radius.class}
              </code>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-bold">Typography</h2>
        <div className="space-y-4 rounded-lg border p-6 bg-card text-card-foreground">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              Heading 1
            </h1>
            <p className="text-sm text-muted-foreground">text-4xl font-extrabold</p>
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-semibold tracking-tight first:mt-0">
              Heading 2
            </h2>
            <p className="text-sm text-muted-foreground">text-3xl font-semibold</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold tracking-tight">Heading 3</h3>
            <p className="text-sm text-muted-foreground">text-2xl font-semibold</p>
          </div>
          <div className="space-y-1">
            <p className="leading-7 [&:not(:first-child)]:mt-6">
              The king, seeing how much happier his subjects were, decided to give them a
              grand feast. Body text with leading-7.
            </p>
            <p className="text-sm text-muted-foreground">leading-7</p>
          </div>
          <div className="space-y-1">
            <blockquote className="mt-6 border-l-2 pl-6 italic">
              "After all," he said, "everyone deserves a good meal once in a while."
            </blockquote>
            <p className="text-sm text-muted-foreground">italic border-l-2 pl-6</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-bold">Background Color Variants</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Subtle background variants for alerts, notifications, and highlighted sections.
          Each includes the appropriate foreground and border colors for accessibility.
        </p>
        <div className="grid gap-4">
          {[
            {
              name: "Muted Background",
              bg: "var(--muted-background)",
              fg: "var(--muted-foreground)",
              border: "var(--border)",
              useCase: "Subtle highlights, disabled states, or secondary information",
            },
            {
              name: "Accent Background",
              bg: "var(--accent-background)",
              fg: "var(--accent-foreground)",
              border: "var(--accent)",
              useCase: "Featured content, special sections, or call-to-action areas",
            },
            {
              name: "Success Background",
              bg: "var(--success-background)",
              fg: "var(--success)",
              border: "var(--success-border)",
              useCase: "Success messages, completed states, or positive confirmations",
            },
            {
              name: "Info Background",
              bg: "var(--info-background)",
              fg: "var(--info)",
              border: "var(--info-border)",
              useCase: "Informational alerts, tips, or helpful guidance",
            },
            {
              name: "Warning Background",
              bg: "var(--warning-background)",
              fg: "var(--warning)",
              border: "var(--warning-border)",
              useCase: "Warning messages, caution areas, or items requiring attention",
            },
            {
              name: "Destructive Background",
              bg: "var(--destructive-background)",
              fg: "var(--destructive)",
              border: "var(--destructive-border)",
              useCase: "Error messages, dangerous actions, or critical alerts",
            },
          ].map((variant) => (
            <div key={variant.name} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{variant.name}</span>
                <code className="text-[10px] text-muted-foreground">{variant.bg}</code>
              </div>
              <div
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: variant.bg,
                  borderColor: variant.border,
                }}
              >
                <p className="text-sm font-medium" style={{ color: variant.fg }}>
                  {variant.useCase}
                </p>
                <p className="mt-1 text-xs opacity-80" style={{ color: variant.fg }}>
                  This demonstrates the background color with its complementary foreground
                  and border colors for optimal contrast and readability.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-bold">Utilities</h2>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">App Surface (Custom Utility)</span>
            <div className="app-surface h-48 w-full rounded-lg border flex items-center justify-center">
              <span className="bg-background/80 px-4 py-2 rounded border shadow-sm">
                Content on App Surface
              </span>
            </div>
            <code className="text-[10px] text-muted-foreground">.app-surface</code>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof ThemeColors> = {
  title: "Theme/Shared Theme",
  component: ThemeColors,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ThemeColors>;

export const Default: Story = {};
