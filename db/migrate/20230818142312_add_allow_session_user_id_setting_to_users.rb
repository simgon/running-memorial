class AddAllowSessionUserIdSettingToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :allow_session_user_id_setting, :boolean, default: false
  end
end
