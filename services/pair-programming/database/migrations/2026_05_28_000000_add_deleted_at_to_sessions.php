<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Soft delete para sesiones.
 *
 * Los eventos publicados en outbox_events siguen siendo inmutables.
 * Los snapshots y logs Yjs en Redis NO se borran.
 * Esto preserva Event Sourcing (los eventos del pasado son la verdad
 * histórica, no se reescriben).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->softDeletes();
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropIndex(['deleted_at']);
            $table->dropSoftDeletes();
        });
    }
};
