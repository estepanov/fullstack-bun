import pino from 'pino'

export const logger = pino({
    formatters: {
        level: (label) => {
            return {
                level: label
            }
        },
        bindings: () => ({})
    },
    timestamp: pino.stdTimeFunctions.isoTime,

    
})