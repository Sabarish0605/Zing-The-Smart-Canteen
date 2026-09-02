// File: spring-backend/src/main/java/com/zing/canteen/dto/OrderRequest.java
package com.zing.canteen.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderRequest {
    private Long vendorId;
    private List<OrderItemDto> items;
}
