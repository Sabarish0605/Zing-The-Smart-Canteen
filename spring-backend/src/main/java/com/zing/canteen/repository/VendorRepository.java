// File: spring-backend/src/main/java/com/zing/canteen/repository/VendorRepository.java
package com.zing.canteen.repository;

import com.zing.canteen.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long> {
}
