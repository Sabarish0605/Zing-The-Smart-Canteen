// File: spring-backend/src/main/java/com/zing/canteen/service/OrderService.java
package com.zing.canteen.service;

import com.zing.canteen.dto.OrderItemDto;
import com.zing.canteen.dto.OrderRequest;
import com.zing.canteen.dto.OrderResponse;
import com.zing.canteen.entity.*;
import com.zing.canteen.entity.enums.OrderStatus;
import com.zing.canteen.entity.enums.PaymentStatus;
import com.zing.canteen.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final StudentRepository studentRepository;
    private final VendorRepository vendorRepository;
    private final MenuItemRepository menuItemRepository;
    private final PaymentRepository paymentRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public OrderResponse createOrder(OrderRequest request, Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        Vendor vendor = vendorRepository.findById(request.getVendorId())
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        Order order = Order.builder()
                .student(student)
                .vendor(vendor)
                .status(OrderStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        
        for (OrderItemDto itemDto : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemDto.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Menu item not found: " + itemDto.getMenuItemId()));
            
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .menuItem(menuItem)
                    .quantity(itemDto.getQuantity())
                    .build();
            
            order.getItems().add(orderItem);
            total = total.add(menuItem.getPrice().multiply(new BigDecimal(itemDto.getQuantity())));
        }

        order.setTotalAmount(total);

        // Generate a verifiable QR Code Hash
        String qrHash = UUID.randomUUID().toString();
        order.setQrCodeHash(qrHash);

        Order savedOrder = orderRepository.save(order);

        // Stubbed Razorpay Order Creation
        String razorpayOrderId = "rzp_order_stub_" + savedOrder.getId();

        Payment payment = Payment.builder()
                .order(savedOrder)
                .razorpayPaymentId(razorpayOrderId)
                .status(PaymentStatus.CREATED)
                .build();
        paymentRepository.save(payment);

        OrderResponse response = mapToResponse(savedOrder, razorpayOrderId);

        // Notify Vendor via WebSocket
        messagingTemplate.convertAndSend("/topic/vendor/" + vendor.getUserId(), response);

        return response;
    }

    public List<OrderResponse> getStudentOrders(Long studentId) {
        return orderRepository.findByStudentUserId(studentId).stream()
                .map(order -> mapToResponse(order, null))
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getVendorOrders(Long vendorId) {
        return orderRepository.findByVendorUserId(vendorId).stream()
                .map(order -> mapToResponse(order, null))
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus status, Long vendorId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getVendor().getUserId().equals(vendorId)) {
            throw new RuntimeException("Unauthorized to update this order");
        }

        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);
        
        OrderResponse response = mapToResponse(updatedOrder, null);
        
        // Notify Student via WebSocket
        messagingTemplate.convertAndSend("/topic/student/" + order.getStudent().getUserId(), response);

        return response;
    }

    @Transactional
    public OrderResponse verifyQrCode(String qrHash, Long vendorId) {
        Order order = orderRepository.findByQrCodeHash(qrHash)
                .orElseThrow(() -> new RuntimeException("Invalid QR Code"));

        if (!order.getVendor().getUserId().equals(vendorId)) {
            throw new RuntimeException("Unauthorized to verify this order");
        }

        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new RuntimeException("Order already completed");
        }

        order.setStatus(OrderStatus.COMPLETED);
        Order updatedOrder = orderRepository.save(order);

        OrderResponse response = mapToResponse(updatedOrder, null);

        // Notify Student via WebSocket
        messagingTemplate.convertAndSend("/topic/student/" + order.getStudent().getUserId(), response);

        return response;
    }

    private OrderResponse mapToResponse(Order order, String razorpayOrderId) {
        return OrderResponse.builder()
                .id(order.getId())
                .studentId(order.getStudent().getUserId())
                .vendorId(order.getVendor().getUserId())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .qrCodeHash(order.getQrCodeHash())
                .razorpayOrderId(razorpayOrderId)
                .items(order.getItems().stream()
                        .map(item -> OrderItemDto.builder()
                                .menuItemId(item.getMenuItem().getId())
                                .quantity(item.getQuantity())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
