package com.cityai.backend.config;

import java.io.File;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Serves saved evidence frames (data/evidence/<camera>/<file>.jpg, written
 * by the AI pipeline) at GET /evidence/** so the frontend evidence viewer
 * can just <img src> a detection's imagePath.
 */
@Configuration
public class EvidenceResourceConfig implements WebMvcConfigurer {

    private final String evidenceDir;

    public EvidenceResourceConfig(@Value("${app.evidence-dir}") String evidenceDir) {
        this.evidenceDir = evidenceDir;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = "file:" + new File(evidenceDir).getAbsolutePath() + File.separator;
        registry.addResourceHandler("/evidence/**").addResourceLocations(location);
    }
}
