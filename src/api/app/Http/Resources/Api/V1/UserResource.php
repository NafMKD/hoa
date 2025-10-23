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
            'phone'         => $this->phone,
            'email'         => $this->email,
            'role'          => $this->role,
            'status'        => $this->status,
            'id_file'       => $this->whenLoaded('idFile', function () {
                return new DocumentResource($this->idFile);
            }),
            'owned_units' => $this->whenLoaded('ownedUnits', function () {
                return UnitResource::collection($this->ownedUnits);
            }),
            'rented_units' => $this->whenLoaded('rentedUnits', function () {
                return UnitResource::collection($this->rentedUnits);
            }),
            // 'payments'      => $this->whenLoaded('payments', function () {
            //     return PaymentResource::collection($this->payments);
            // }),
            // 'invoices'       => $this->whenLoaded('invoices', function () {
            //     return InvoiceResource::collection($this->invoices);
            // }),
            'leases'        => $this->whenLoaded('leases', function () {
                return TenantLeaseResource::collection($this->leases);
            }),
            'created_leases' => $this->whenLoaded('createdLeases', function () {
                return TenantLeaseResource::collection($this->createdLeases);
            }),
            // 'created_expenses' => $this->whenLoaded('createdExpenses', function () {
            //     return ExpenseResource::collection($this->createdExpenses);
            // }),
            // 'created_stickers' => $this->whenLoaded('createdStickers', function () {
            //     return StickerResource::collection($this->createdStickers);
            // }),
            // 'votes' => $this->whenLoaded('votes', function () {
            //     return VoteResource::collection($this->votes);
            // }),
            // 'vehicles' => $this->whenLoaded('vehicles', function () {
            //     return VehicleResource::collection($this->vehicles);
            // }),
            // 'issued_stickers' => $this->whenLoaded('issuedStickers', function () {
            //     return StickerResource::collection($this->issuedStickers);
            // }),
            // 'audit_logs' => $this->whenLoaded('auditLogs', function () {
            //     return AuditLogResource::collection($this->auditLogs);
            // }),
            'created_templates' => $this->whenLoaded('createdTemplates', function () {
                return DocumentTemplateResource::collection($this->createdTemplates);
            }),
            'updated_templates' => $this->whenLoaded('updatedTemplates', function () {
                return DocumentTemplateResource::collection($this->updatedTemplates);
            }),
            'representative_leases' => $this->whenLoaded('representativeLeases', function () {
                return TenantLeaseResource::collection($this->representativeLeases);
            }),
            'last_login_at' => $this->last_login_at,
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at,
        ];
    }
}
