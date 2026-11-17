package io.github.matthiaskebede.gametracker.entry;

/**
 * JSON shape of an entry in API responses.
 */
public record EntryResponse(Long id, Long gameId, Long platformId, String platformName, int playtimeMinutes,
		BacklogStatus status, PlaytimeSource playtimeSource) {

	public static EntryResponse from(Entry entry) {
		return new EntryResponse(entry.getId(), entry.getGame().getId(), entry.getPlatform().getId(),
				entry.getPlatform().getName(), entry.getPlaytimeMinutes(), entry.getStatus(),
				entry.getPlaytimeSource());
	}

}
