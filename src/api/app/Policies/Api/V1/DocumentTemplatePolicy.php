<?php

namespace App\Policies\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\DocumentTemplate;

class DocumentTemplatePolicy
{
    /**
     * Only admin can view all templates.
     */
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin can view a specific template.
     */
    public function view(User $authUser, DocumentTemplate $template): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin can create templates.
     */
    public function create(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin can update templates.
     */
    public function update(User $authUser, DocumentTemplate $template): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin can delete templates.
     */
    public function delete(User $authUser, DocumentTemplate $template): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin can generate new documents from templates.
     */
    public function generate(User $authUser, DocumentTemplate $template): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }
}
