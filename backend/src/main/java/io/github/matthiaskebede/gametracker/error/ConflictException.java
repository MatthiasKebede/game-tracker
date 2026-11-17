package io.github.matthiaskebede.gametracker.error;

/**
 * Thrown by services when a request is valid on its own but clashes with
 * existing data. ApiExceptionHandler turns it into a 409 response.
 */
public class ConflictException extends RuntimeException {

	public ConflictException(String message) {
		super(message);
	}

}
