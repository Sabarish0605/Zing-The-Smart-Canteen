// File: spring-backend/src/main/java/com/zing/canteen/service/MenuService.java
package com.zing.canteen.service;

import com.zing.canteen.dto.MenuItemDto;
import com.zing.canteen.entity.MenuItem;
import com.zing.canteen.entity.Vendor;
import com.zing.canteen.repository.MenuItemRepository;
import com.zing.canteen.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuItemRepository menuItemRepository;
    private final VendorRepository vendorRepository;
    private final String UPLOAD_DIR = "uploads/";

    public List<MenuItemDto> getAllAvailableItems() {
        return menuItemRepository.findByIsAvailableTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<MenuItemDto> getItemsByVendor(Long vendorId) {
        return menuItemRepository.findByVendorUserId(vendorId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public MenuItemDto createMenuItem(MenuItemDto dto, MultipartFile image, Long vendorId) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            imageUrl = saveImage(image);
        } else {
            imageUrl = dto.getImageUrl();
        }

        MenuItem item = MenuItem.builder()
                .vendor(vendor)
                .name(dto.getName())
                .price(dto.getPrice())
                .imageUrl(imageUrl)
                .isAvailable(dto.getIsAvailable() != null ? dto.getIsAvailable() : true)
                .build();

        return mapToDto(menuItemRepository.save(item));
    }

    @Transactional
    public MenuItemDto updateMenuItem(Long id, MenuItemDto dto, MultipartFile image, Long vendorId) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        if (!item.getVendor().getUserId().equals(vendorId)) {
            throw new RuntimeException("Unauthorized to update this item");
        }

        if (image != null && !image.isEmpty()) {
            item.setImageUrl(saveImage(image));
        } else if (dto.getImageUrl() != null) {
            item.setImageUrl(dto.getImageUrl());
        }

        item.setName(dto.getName() != null ? dto.getName() : item.getName());
        item.setPrice(dto.getPrice() != null ? dto.getPrice() : item.getPrice());
        item.setIsAvailable(dto.getIsAvailable() != null ? dto.getIsAvailable() : item.getIsAvailable());

        return mapToDto(menuItemRepository.save(item));
    }

    @Transactional
    public void deleteMenuItem(Long id, Long vendorId) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));
        
        if (!item.getVendor().getUserId().equals(vendorId)) {
            throw new RuntimeException("Unauthorized to delete this item");
        }
        menuItemRepository.delete(item);
    }

    private String saveImage(MultipartFile file) {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);
            return "/uploads/" + fileName; // Served statically
        } catch (IOException e) {
            throw new RuntimeException("Failed to store image file", e);
        }
    }

    private MenuItemDto mapToDto(MenuItem item) {
        return MenuItemDto.builder()
                .id(item.getId())
                .name(item.getName())
                .price(item.getPrice())
                .imageUrl(item.getImageUrl())
                .isAvailable(item.getIsAvailable())
                .vendorId(item.getVendor().getUserId())
                .build();
    }
}
