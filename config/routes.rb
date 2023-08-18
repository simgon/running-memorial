Rails.application.routes.draw do
  root "routes#index"
  resources :routes
  resources :locations, only: [:show, :create, :destroy]
  resources :users, only: [:update]
  post "/routes/copy", to: "routes#copy"
  post "/routes/visible", to: "routes#visible"
  post "/routes/order", to: "routes#order"
end
