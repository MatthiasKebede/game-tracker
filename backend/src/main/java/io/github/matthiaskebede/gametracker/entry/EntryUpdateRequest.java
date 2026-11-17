package io.github.matthiaskebede.gametracker.entry;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * JSON body for updating an entry. The game and platform of an entry cannot
 * change, so they are not part of the body. To move a game to another
 * platform, delete the entry and add a new one.
 */
public record EntryUpdateRequest(@NotNull BacklogStatus status, @NotNull @PositiveOrZero Integer playtimeMinutes) {

}
