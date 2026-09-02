// File: spring-backend/src/main/java/com/zing/canteen/repository/OrderRepository.java
package com.zing.canteen.repository;

import com.zing.canteen.entity.Order;
import com.zing.canteen.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByStudentUserId(Long studentId);
    List<Order> findByVendorUserId(Long vendorId);
    List<Order> findByVendorUserIdAndStatus(Long vendorId, OrderStatus status);
    Optional<Order> findByQrCodeHash(String qrCodeHash);
}
