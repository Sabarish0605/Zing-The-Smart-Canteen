// File: spring-backend/src/main/java/com/zing/canteen/dto/MenuItemDto.java
package com.zing.canteen.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MenuItemDto {
    private Long id;
    private String name;
    private BigDecimal price;
    private String imageUrl;
    private Boolean isAvailable;
    private Long vendorId;
}
