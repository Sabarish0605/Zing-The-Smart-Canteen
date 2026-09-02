// File: spring-backend/src/main/java/com/zing/canteen/dto/OrderItemDto.java
package com.zing.canteen.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderItemDto {
    private Long menuItemId;
    private Integer quantity;
}
