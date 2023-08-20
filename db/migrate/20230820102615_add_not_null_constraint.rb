class AddNotNullConstraint < ActiveRecord::Migration[7.0]
  def change
    change_column :users, :user_token, :string, null: false
  end
end
