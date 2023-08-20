class AddNullConstraint < ActiveRecord::Migration[7.0]
  def change
    change_column :routes, :user_id, :string, null: true
  end
end
