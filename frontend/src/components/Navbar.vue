<template>
  <nav class="navbar navbar-expand-lg navbar-dark navbar-custom">
    <div class="container">
      <router-link class="navbar-brand" to="/">ライブ抽選アプリ</router-link>
      <ul class="navbar-nav ms-auto">
        <li class="nav-item">
          <router-link class="nav-link" to="/">イベント一覧</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/admin">管理画面</router-link>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts"></script>
