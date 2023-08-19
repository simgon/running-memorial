class AddUserTokenToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :user_token, :string
  end
end
