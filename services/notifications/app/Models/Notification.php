<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int         $id
 * @property int         $user_id
 * @property string      $type       session.started | session.ended | session_report
 * @property string      $payload    JSON string
 * @property string|null $read_at
 * @property string      $created_at
 */
class Notification extends Model
{
    protected $table    = 'notifications';
    protected $fillable = ['user_id', 'type', 'payload', 'read_at'];

    protected $casts = [
        'read_at' => 'datetime',
    ];
}
