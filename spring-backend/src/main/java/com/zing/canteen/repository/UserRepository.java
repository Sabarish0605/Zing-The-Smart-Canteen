// File: spring-backend/src/main/java/com/zing/canteen/repository/UserRepository.java
package com.zing.canteen.repository;

import com.zing.canteen.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
