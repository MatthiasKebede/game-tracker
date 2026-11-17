package io.github.matthiaskebede.gametracker.entry;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * JSON body for adding a game to a platform. Playtime is optional and counts
 * as zero when left out.
 */
public record EntryCreateRequest(@NotNull Long platformId, @NotNull BacklogStatus status,
		@PositiveOrZero Integer playtimeMinutes) {

}
