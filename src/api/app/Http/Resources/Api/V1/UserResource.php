<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'first_name'    => $this->first_name,
            'last_name'     => $this->last_name,
            'full_name'     => $this->full_name,
            'phone'         => $this->phone,
            'email'         => $this->email,
            'role'          => $this->role,
            'city'          => $this->city,
            'sub_city'      => $this->sub_city,
            'woreda'        => $this->woreda,
            'house_number'  => $this->house_number,
            'status'        => $this->status,
            'id_file'       => $this->whenLoaded('idFile', function () {
                return new DocumentResource($this->idFile);
            }),
            'last_login_at' => \Carbon\Carbon::parse($this->last_login_at)->toFormattedDateString(),
            'created_at'    => \Carbon\Carbon::parse($this->created_at)->toFormattedDateString(),
            'updated_at'    => \Carbon\Carbon::parse($this->updated_at)->toFormattedDateString(),
        ];
    }
}
