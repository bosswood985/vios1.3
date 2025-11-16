import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Users, Edit, UserPlus, Shield, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const roleConfig = {
  admin: { label: "Administrateur", color: "bg-red-100 text-red-800", icon: Shield },
  secretaire: { label: "Secrétaire", color: "bg-purple-100 text-purple-800", icon: Users },
  orthoptiste: { label: "Orthoptiste", color: "bg-blue-100 text-blue-800", icon: Users },
  ophtalmologue: { label: "Ophtalmologue", color: "bg-green-100 text-green-800", icon: Users },
};

export default function GestionUtilisateurs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const [formData, setFormData] = useState({
    full_name: "",
    specialite: "secretaire"
  });

  const [createFormData, setCreateFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    specialite: "secretaire"
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        if (user.specialite !== 'admin') {
          navigate(createPageUrl("SalleAttente"));
        }
      } catch (error) {
        console.error('Error loading user:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, [navigate]);

  const { data: users, isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/User`, {
          headers: {
            'Authorization': `Bearer ${base44.auth.getToken()}`,
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const result = await response.json();
        return result.data || result;
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    initialData: [],
    enabled: !!currentUser && currentUser.specialite === 'admin',
  });

  const handleCreateUser = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    
    if (!createFormData.email || !createFormData.password || !createFormData.full_name || !createFormData.specialite) {
      setErrorMessage("Tous les champs sont obligatoires");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createFormData.email)) {
      setErrorMessage("Email invalide");
      return;
    }

    // Password strength check
    if (createFormData.password.length < 6) {
      setErrorMessage("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/User`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${base44.auth.getToken()}`,
        },
        body: JSON.stringify(createFormData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }
      
      await refetchUsers();
      setShowCreateDialog(false);
      setCreateFormData({
        email: "",
        password: "",
        full_name: "",
        specialite: "secretaire"
      });
      setSuccessMessage("Utilisateur créé avec succès");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error('Create user error:', error);
      setErrorMessage(error.message || "Erreur lors de la création de l'utilisateur");
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || "",
      specialite: user.specialite || "secretaire"
    });
    setShowEditDialog(true);
    setErrorMessage("");
  };

  const handleSaveUser = async () => {
    setErrorMessage("");
    
    if (!editingUser || !formData.full_name || !formData.specialite) {
      setErrorMessage("Nom et spécialité sont obligatoires");
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/User/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${base44.auth.getToken()}`,
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          specialite: formData.specialite,
          role: formData.specialite
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
      
      await refetchUsers();
      setShowEditDialog(false);
      setEditingUser(null);
      setFormData({ full_name: "", specialite: "secretaire" });
      setSuccessMessage("Utilisateur modifié avec succès");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error('Update user error:', error);
      setErrorMessage(error.message || "Erreur lors de la modification");
    }
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
    setErrorMessage("");
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/User/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${base44.auth.getToken()}`,
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }
      
      await refetchUsers();
      setShowDeleteDialog(false);
      setUserToDelete(null);
      setSuccessMessage("Utilisateur supprimé");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error('Delete user error:', error);
      setErrorMessage(error.message || "Erreur lors de la suppression");
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.specialite !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Accès refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Seuls les administrateurs peuvent accéder à cette page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
              <Badge className="bg-red-100 text-red-800">
                <Shield className="w-3 h-3 mr-1" />
                Administrateur uniquement
              </Badge>
            </div>
            <p className="text-gray-500">Gérer les rôles et permissions</p>
          </div>
          <Button
            onClick={() => {
              setShowCreateDialog(true);
              setErrorMessage("");
            }}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Créer un utilisateur
          </Button>
        </div>

        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && !showCreateDialog && !showEditDialog && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingUsers ? (
            <div className="col-span-3 text-center py-8 text-gray-500">
              Chargement des utilisateurs...
            </div>
          ) : users.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-gray-500">
              Aucun utilisateur trouvé
            </div>
          ) : (
            users.map((user) => {
              const config = roleConfig[user.specialite] || { 
                label: user.specialite || "Non défini", 
                color: "bg-gray-100 text-gray-800",
                icon: Users
              };
              const Icon = config.icon;
              const isCurrentUser = user.id === currentUser.id;

              return (
                <Card key={user.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {user.full_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {user.full_name || 'Utilisateur'}
                            {isCurrentUser && (
                              <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                                Vous
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={`${config.color} flex items-center gap-1`}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Modifier
                        </Button>
                        {!isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {user.created_date && (
                      <div className="text-xs text-gray-500">
                        Créé le {new Date(user.created_date).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Create User Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {errorMessage && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  placeholder="utilisateur@exemple.com"
                />
              </div>
              <div>
                <Label>Mot de passe *</Label>
                <Input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  placeholder="Minimum 6 caractères"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Le mot de passe doit contenir au moins 6 caractères
                </p>
              </div>
              <div>
                <Label>Nom complet *</Label>
                <Input
                  value={createFormData.full_name}
                  onChange={(e) => setCreateFormData({ ...createFormData, full_name: e.target.value })}
                  placeholder="Dr. Prénom Nom"
                />
              </div>
              <div>
                <Label>Rôle / Spécialité *</Label>
                <Select
                  value={createFormData.specialite}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, specialite: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-600" />
                        Administrateur
                      </div>
                    </SelectItem>
                    <SelectItem value="secretaire">Secrétaire</SelectItem>
                    <SelectItem value="orthoptiste">Orthoptiste</SelectItem>
                    <SelectItem value="ophtalmologue">Ophtalmologue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateDialog(false);
                    setErrorMessage("");
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateUser} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Créer l'utilisateur
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {errorMessage && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              <div>
                <Label>Nom complet *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Dr. Prénom Nom"
                />
              </div>
              <div>
                <Label>Email</Label>
                <div className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                  {editingUser?.email}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  L'email ne peut pas être modifié
                </p>
              </div>
              <div>
                <Label>Rôle / Spécialité *</Label>
                <Select
                  value={formData.specialite}
                  onValueChange={(value) => setFormData({ ...formData, specialite: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-600" />
                        Administrateur
                      </div>
                    </SelectItem>
                    <SelectItem value="secretaire">Secrétaire</SelectItem>
                    <SelectItem value="orthoptiste">Orthoptiste</SelectItem>
                    <SelectItem value="ophtalmologue">Ophtalmologue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEditDialog(false);
                    setErrorMessage("");
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleSaveUser} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Supprimer l'utilisateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="bg-red-50 border-red-200">
                <Trash2 className="h-4 w-4 text-red-600" />
                <AlertDescription className="ml-2">
                  <strong>Attention !</strong> Cette action est irréversible.
                </AlertDescription>
              </Alert>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  Vous êtes sur le point de supprimer :
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {userToDelete?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{userToDelete?.full_name || 'Utilisateur'}</p>
                    <p className="text-xs text-gray-500">{userToDelete?.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={confirmDeleteUser}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer définitivement
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}