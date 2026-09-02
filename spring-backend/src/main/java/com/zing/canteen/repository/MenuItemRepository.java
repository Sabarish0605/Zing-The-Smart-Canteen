// File: spring-backend/src/main/java/com/zing/canteen/repository/MenuItemRepository.java
package com.zing.canteen.repository;

import com.zing.canteen.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByVendorUserId(Long vendorId);
    List<MenuItem> findByIsAvailableTrue();
}
