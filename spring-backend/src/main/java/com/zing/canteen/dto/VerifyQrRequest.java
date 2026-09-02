// File: spring-backend/src/main/java/com/zing/canteen/dto/VerifyQrRequest.java
package com.zing.canteen.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VerifyQrRequest {
    private String qrCodeHash;
}
