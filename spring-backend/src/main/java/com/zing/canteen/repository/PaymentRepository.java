// File: spring-backend/src/main/java/com/zing/canteen/repository/PaymentRepository.java
package com.zing.canteen.repository;

import com.zing.canteen.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);
}
