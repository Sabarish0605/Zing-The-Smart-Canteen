// File: spring-backend/src/main/java/com/zing/canteen/repository/StudentRepository.java
package com.zing.canteen.repository;

import com.zing.canteen.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByRollNumber(String rollNumber);
    boolean existsByRollNumber(String rollNumber);
}
