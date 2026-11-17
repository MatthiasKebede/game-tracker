package io.github.matthiaskebede.gametracker.platform;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data generates the implementation of this interface at startup. The
 * type arguments are the entity class and the type of its id.
 */
public interface PlatformRepository extends JpaRepository<Platform, Long> {

}
