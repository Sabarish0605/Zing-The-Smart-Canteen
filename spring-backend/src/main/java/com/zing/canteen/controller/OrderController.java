// File: spring-backend/src/main/java/com/zing/canteen/controller/OrderController.java
package com.zing.canteen.controller;

import com.zing.canteen.dto.OrderRequest;
import com.zing.canteen.dto.OrderResponse;
import com.zing.canteen.dto.VerifyQrRequest;
import com.zing.canteen.entity.User;
import com.zing.canteen.repository.UserRepository;
import com.zing.canteen.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderRequest request, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(orderService.createOrder(request, user.getId()));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderResponse>> getStudentOrders(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(orderService.getStudentOrders(user.getId()));
    }

    @PreAuthorize("hasRole('VENDOR')")
    @GetMapping("/vendor")
    public ResponseEntity<List<OrderResponse>> getVendorOrders(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(orderService.getVendorOrders(user.getId()));
    }

    @PreAuthorize("hasRole('VENDOR')")
    @PostMapping("/verify-qr")
    public ResponseEntity<OrderResponse> verifyQrCode(@RequestBody VerifyQrRequest request, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(orderService.verifyQrCode(request.getQrCodeHash(), user.getId()));
    }
}
