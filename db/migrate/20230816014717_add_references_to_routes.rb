class AddReferencesToRoutes < ActiveRecord::Migration[7.0]
  def change
    add_reference :routes, :user, null: true, foreign_key: true
  end
end
