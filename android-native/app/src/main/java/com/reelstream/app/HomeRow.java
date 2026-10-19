package com.reelstream.app;

import java.util.List;

public class HomeRow {
    private String title;
    private List<MediaItem> items;
    private boolean isTop10;

    public HomeRow(String title, List<MediaItem> items, boolean isTop10) {
        this.title = title;
        this.items = items;
        this.isTop10 = isTop10;
    }

    public String getTitle() { return title; }
    public List<MediaItem> getItems() { return items; }
    public boolean isTop10() { return isTop10; }
}
