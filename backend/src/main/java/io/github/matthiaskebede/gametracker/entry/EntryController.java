package io.github.matthiaskebede.gametracker.entry;

import java.net.URI;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/**
 * HTTP layer for entries. An entry is created under its game
 * (/api/games/{gameId}/entries) and afterwards addressed by its own id
 * (/api/entries/{id}). Entries are read as part of their game, so there is no
 * GET here.
 */
@RestController
public class EntryController {

	private final EntryService entryService;

	public EntryController(EntryService entryService) {
		this.entryService = entryService;
	}

	@PostMapping("/api/games/{gameId}/entries")
	public ResponseEntity<EntryResponse> addEntry(@PathVariable Long gameId,
			@Valid @RequestBody EntryCreateRequest request) {
		EntryResponse created = this.entryService.addEntry(gameId, request);
		return ResponseEntity.created(URI.create("/api/games/" + gameId)).body(created);
	}

	@PutMapping("/api/entries/{id}")
	public EntryResponse updateEntry(@PathVariable Long id, @Valid @RequestBody EntryUpdateRequest request) {
		return this.entryService.updateEntry(id, request);
	}

	@DeleteMapping("/api/entries/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteEntry(@PathVariable Long id) {
		this.entryService.deleteEntry(id);
	}

}
