"""Task de exemplo para demonstrar uso do Celery."""

from celery import shared_task


@shared_task
def example_task(message: str) -> str:
    """Task de exemplo.

    Args:
        message: Mensagem a ser processada.

    Returns:
        String com mensagem processada.
    """
    print(f"Task executada: {message}")
    return f"Processado: {message}"




