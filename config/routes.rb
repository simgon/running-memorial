Rails.application.routes.draw do
  root "static_pages#home"
  resources :routes
  resources :locations, only: [:show, :create, :destroy]
  post   "/routes/copy",    to: "routes#copy"
  post   "/routes/visible", to: "routes#visible"
  post   "/routes/order",   to: "routes#order"
  resources :users #,     only: [:index, :update, :destroy]
  get    "/signup",         to: "users#new"
  get    "/login",          to: "sessions#new"
  post   "/login",          to: "sessions#create"
  delete "/logout",         to: "sessions#destroy"
  resources :account_activations, only: [:edit]
  resources :password_resets,     only: [:new, :create, :edit, :update]
  get    "/privacypolicy",  to: "static_pages#privacypolicy"
end
