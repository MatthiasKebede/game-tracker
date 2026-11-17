package io.github.matthiaskebede.gametracker.error;

/**
 * Thrown by services when a requested row does not exist. ApiExceptionHandler
 * turns it into a 404 response, so services never deal with HTTP themselves.
 */
public class NotFoundException extends RuntimeException {

	public NotFoundException(String message) {
		super(message);
	}

}
