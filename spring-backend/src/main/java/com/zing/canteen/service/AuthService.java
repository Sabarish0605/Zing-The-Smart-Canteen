// File: spring-backend/src/main/java/com/zing/canteen/service/AuthService.java
package com.zing.canteen.service;

import com.zing.canteen.dto.AuthResponse;
import com.zing.canteen.dto.LoginRequest;
import com.zing.canteen.dto.RegisterRequest;
import com.zing.canteen.entity.Student;
import com.zing.canteen.entity.User;
import com.zing.canteen.entity.Vendor;
import com.zing.canteen.entity.enums.Role;
import com.zing.canteen.repository.StudentRepository;
import com.zing.canteen.repository.UserRepository;
import com.zing.canteen.repository.VendorRepository;
import com.zing.canteen.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final VendorRepository vendorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();

        User savedUser = userRepository.save(user);

        if (request.getRole() == Role.STUDENT) {
            if (studentRepository.existsByRollNumber(request.getRollNumber())) {
                throw new RuntimeException("Roll number already registered");
            }
            Student student = Student.builder()
                    .user(savedUser)
                    .rollNumber(request.getRollNumber())
                    .name(request.getName())
                    .build();
            studentRepository.save(student);
        } else if (request.getRole() == Role.VENDOR) {
            Vendor vendor = Vendor.builder()
                    .user(savedUser)
                    .shopName(request.getShopName())
                    .build();
            vendorRepository.save(vendor);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String jwtToken = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(jwtToken)
                .message("User registered successfully")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String jwtToken = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(jwtToken)
                .message("Login successful")
                .build();
    }
}
