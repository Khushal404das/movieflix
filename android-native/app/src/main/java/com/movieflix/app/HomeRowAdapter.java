package com.movieflix.app;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class HomeRowAdapter extends RecyclerView.Adapter<HomeRowAdapter.RowViewHolder> {
    private final Context context;
    private final List<HomeRow> rows;
    private final MediaCardAdapter.OnItemClickListener listener;

    public HomeRowAdapter(Context context, List<HomeRow> rows, MediaCardAdapter.OnItemClickListener listener) {
        this.context = context;
        this.rows = rows;
        this.listener = listener;
    }

    @NonNull
    @Override
    public RowViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_home_row, parent, false);
        return new RowViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull RowViewHolder holder, int position) {
        HomeRow row = rows.get(position);
        holder.tvRowTitle.setText(row.getTitle());

        LinearLayoutManager layoutManager = new LinearLayoutManager(context, LinearLayoutManager.HORIZONTAL, false);
        holder.rvCards.setLayoutManager(layoutManager);
        holder.rvCards.setHasFixedSize(true);

        MediaCardAdapter cardAdapter = new MediaCardAdapter(context, row.getItems(), row.isTop10(), listener);
        holder.rvCards.setAdapter(cardAdapter);
    }

    @Override
    public int getItemCount() {
        return rows != null ? rows.size() : 0;
    }

    public static class RowViewHolder extends RecyclerView.ViewHolder {
        TextView tvRowTitle;
        RecyclerView rvCards;

        public RowViewHolder(@NonNull View itemView) {
            super(itemView);
            tvRowTitle = itemView.findViewById(R.id.tvRowTitle);
            rvCards = itemView.findViewById(R.id.rvCards);
        }
    }
}
