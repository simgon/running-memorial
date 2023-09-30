class User < ApplicationRecord
  has_many :routes, dependent: :destroy
  before_create :create_user_token

  # 渡された文字列のハッシュ値を返す
  def User.digest(string)
    cost = ActiveModel::SecurePassword.min_cost ? BCrypt::Engine::MIN_COST :
                                                  BCrypt::Engine.cost
    BCrypt::Password.create(string, cost: cost)
  end

  # ランダムなトークンを返す
  def User.new_token
    SecureRandom.urlsafe_base64
  end

  # 最終ログイン日時を更新
  def update_last_login_at
    self.update(last_login_at: Time.current)
  end

  private

    # ユーザートークンを作成および代入する
    def create_user_token
      self.user_token = User.new_token
    end
end
