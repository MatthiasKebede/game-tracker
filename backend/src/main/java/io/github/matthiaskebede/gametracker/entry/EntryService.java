package io.github.matthiaskebede.gametracker.entry;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.github.matthiaskebede.gametracker.error.ConflictException;
import io.github.matthiaskebede.gametracker.error.NotFoundException;
import io.github.matthiaskebede.gametracker.game.Game;
import io.github.matthiaskebede.gametracker.game.GameRepository;
import io.github.matthiaskebede.gametracker.platform.Platform;
import io.github.matthiaskebede.gametracker.platform.PlatformRepository;

/**
 * Business logic for entries (one game on one platform).
 */
@Service
@Transactional
public class EntryService {

	private final EntryRepository entryRepository;

	private final GameRepository gameRepository;

	private final PlatformRepository platformRepository;

	public EntryService(EntryRepository entryRepository, GameRepository gameRepository,
			PlatformRepository platformRepository) {
		this.entryRepository = entryRepository;
		this.gameRepository = gameRepository;
		this.platformRepository = platformRepository;
	}

	public EntryResponse addEntry(Long gameId, EntryCreateRequest request) {
		Game game = this.gameRepository.findById(gameId)
			.orElseThrow(() -> new NotFoundException("Game " + gameId + " not found"));
		Platform platform = this.platformRepository.findById(request.platformId())
			.orElseThrow(() -> new NotFoundException("Platform " + request.platformId() + " not found"));
		// Checked here to give a clear 409. The unique constraint in the database
		// remains as the final safeguard.
		if (this.entryRepository.existsByGameIdAndPlatformId(gameId, platform.getId())) {
			throw new ConflictException(
					"Game " + gameId + " already has an entry for platform " + platform.getName());
		}
		int playtimeMinutes = (request.playtimeMinutes() != null) ? request.playtimeMinutes() : 0;
		Entry entry = new Entry(platform, request.status(), playtimeMinutes);
		entry.setGame(game);
		return EntryResponse.from(this.entryRepository.save(entry));
	}

	public EntryResponse updateEntry(Long id, EntryUpdateRequest request) {
		Entry entry = findEntry(id);
		entry.setStatus(request.status());
		entry.setPlaytimeMinutes(request.playtimeMinutes());
		return EntryResponse.from(entry);
	}

	public void deleteEntry(Long id) {
		this.entryRepository.delete(findEntry(id));
	}

	private Entry findEntry(Long id) {
		return this.entryRepository.findById(id)
			.orElseThrow(() -> new NotFoundException("Entry " + id + " not found"));
	}

}
