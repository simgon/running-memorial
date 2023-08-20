class AddNotNullConstraint < ActiveRecord::Migration[7.0]
  def change
    change_column :users, :user_token, :string, null: false
    remove_reference :routes, :user
    add_reference :routes, :user, null: false, foreign_key: true
  end
end
