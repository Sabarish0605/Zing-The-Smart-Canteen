// File: spring-backend/src/main/java/com/zing/canteen/controller/MenuController.java
package com.zing.canteen.controller;

import com.zing.canteen.dto.MenuItemDto;
import com.zing.canteen.entity.User;
import com.zing.canteen.repository.UserRepository;
import com.zing.canteen.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<MenuItemDto>> getAvailableMenu() {
        return ResponseEntity.ok(menuService.getAllAvailableItems());
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<MenuItemDto>> getVendorMenu(@PathVariable Long vendorId) {
        return ResponseEntity.ok(menuService.getItemsByVendor(vendorId));
    }

    @PreAuthorize("hasRole('VENDOR')")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItemDto> createMenuItem(
            @RequestPart("item") MenuItemDto dto,
            @RequestPart(value = "image", required = false) MultipartFile image,
            Authentication authentication
    ) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(menuService.createMenuItem(dto, image, user.getId()));
    }

    @PreAuthorize("hasRole('VENDOR')")
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItemDto> updateMenuItem(
            @PathVariable Long id,
            @RequestPart("item") MenuItemDto dto,
            @RequestPart(value = "image", required = false) MultipartFile image,
            Authentication authentication
    ) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(menuService.updateMenuItem(id, dto, image, user.getId()));
    }

    @PreAuthorize("hasRole('VENDOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long id, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        menuService.deleteMenuItem(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
