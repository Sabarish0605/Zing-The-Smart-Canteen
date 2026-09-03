// File: spring-backend/src/main/java/com/zing/canteen/dto/AuthResponse.java
package com.zing.canteen.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String message;
    private Long userId;
}
