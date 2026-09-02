// File: spring-backend/src/main/java/com/zing/canteen/dto/OrderResponse.java
package com.zing.canteen.dto;

import com.zing.canteen.entity.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderResponse {
    private Long id;
    private Long studentId;
    private Long vendorId;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private String qrCodeHash;
    private String razorpayOrderId; // Stubbed for frontend processing
    private List<OrderItemDto> items;
}
