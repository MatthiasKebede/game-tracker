package io.github.matthiaskebede.gametracker.game;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * JSON body for creating or updating a game. The annotations are checked
 * before the controller method runs, because its parameter is marked @Valid.
 * Series and rating are optional (null is allowed).
 */
public record GameRequest(@NotBlank @Size(max = 255) String name, @Size(max = 255) String series,
		@Min(1) @Max(10) Integer rating) {

}
