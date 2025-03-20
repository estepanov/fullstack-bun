import pino from 'pino'

export const appLogger = pino({
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

export type AppLogger = typeof appLogger