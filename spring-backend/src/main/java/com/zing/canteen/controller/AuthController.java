// File: spring-backend/src/main/java/com/zing/canteen/controller/AuthController.java
package com.zing.canteen.controller;

import com.zing.canteen.dto.AuthResponse;
import com.zing.canteen.dto.LoginRequest;
import com.zing.canteen.dto.RegisterRequest;
import com.zing.canteen.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
