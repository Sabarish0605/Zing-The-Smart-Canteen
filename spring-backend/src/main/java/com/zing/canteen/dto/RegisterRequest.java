// File: spring-backend/src/main/java/com/zing/canteen/dto/RegisterRequest.java
package com.zing.canteen.dto;

import com.zing.canteen.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String email;
    private String password;
    private Role role;
    
    // For student
    private String rollNumber;
    private String name;
    
    // For vendor
    private String shopName;
}
