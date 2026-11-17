package io.github.matthiaskebede.gametracker.entry;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EntryRepository extends JpaRepository<Entry, Long> {

	// Derived from the method name: is there an entry with this game id and platform id?
	boolean existsByGameIdAndPlatformId(Long gameId, Long platformId);

}
