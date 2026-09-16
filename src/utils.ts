export function formatError(context: string, error: unknown): string {
    const message =  error instanceof Error ? error.message : String(error);
    return `${context}: ${message}`;
}

