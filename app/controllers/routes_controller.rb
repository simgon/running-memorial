class RoutesController < ApplicationController
  layout 'main'
  before_action :set_user, only: [:index, :create, :show, :edit, :update, :destroy, :copy]
  before_action :set_route, only: [:show, :edit, :update, :destroy]

  MAX_ROUTE = 10; # 登録ルート上限数

  # GET /routes
  # Route一覧を表示
  def index
    # ユーザーを取得できなかった場合
    unless @user
      # ユーザーを新規作成
      @user = User.new
      @user.password = 'tmp_password'
      @user.save!

      cookies.delete(:user_id)
      cookies.delete(:remember_token)
    end

    # ユーザートークンをCookieに保存
    cookies.permanent.encrypted[:user_token] = @user.user_token

    # 最終ログイン日時を更新
    @user.update_last_login_at

    # Route情報を取得
    @routes = Route.where(user_id: @user.id).order(:order, created_at: :desc)

    respond_to do |format|
      format.html # HTML形式のビューを表示
      format.json { render json: @routes.to_json } # JSON形式でデータを返す
    end

    # logger.info "ルート一覧: #{@routes.to_yaml}"
  end

  # GET /routes/1
  def show
  end

  # GET /routes/new
  def new
    @route = Route.new
  end

  # GET /routes/1/edit
  def edit
  end

  # POST /routes
  # Route新規登録
  def create
    # ルート上限数チェック
    if invalid_create_route
      flash.now.notice = "ルート数が上限(#{MAX_ROUTE}ルート)に達しました。"
      return
    end

    @route = Route.new(route_params_create)
    @route.user_id = @user.id
    @route.order = 0

    if @route.save
      flash.now.notice = t('messages.common.create.success')
    else
      flash.now.notice = @route.errors.full_messages.first
      @route = nil
    end

    # 暗黙的に`render :create`でビューがレンダリングされる(create.turbo_stream.erb)
    # render :create
  end

  # PATCH/PUT /routes/1
  # Route情報更新
  def update
    if @route.update(route_params_update)
      flash.now.notice = t('messages.common.update.success')
    else
      flash.now.notice = @route.errors.full_messages.first
      @route = Route.find(@route.id)
    end
  end

  # DELETE /routes/1
  # Route情報削除
  def destroy
    @route.destroy!
    flash.now.notice = t('messages.common.destroy.success')
  end

  # Route情報コピー新規登録
  def copy
    # ルート上限数チェック
    if invalid_create_route
      flash.now.notice = "ルート数が上限(#{MAX_ROUTE}ルート)に達しました。"
      return
    end

    # コピー元のRouteを取得
    @org_route = Route.find(params[:route][:id])

    # Routeを複製
    new_route = @org_route.dup
    new_route.name += '_コピー'
    # nameが最大文字数を超える場合、最大文字数に切り詰める
    new_route.name = new_route.name[0...Route.validators_on(:name).first.options[:maximum]]
    new_route.order = 0

    # コピー元のRouteに紐づくLocationモデルを複製して、新しいRouteに紐づける
    # new_route.locations = @org_route.locations.map { |location| location.dup }
    new_route.locations = @org_route.locations.map(&:dup)

    # 新しいRouteを新規登録
    if new_route.save
      @route = new_route
      flash.now.notice = t('messages.routes.copy.success')
    else
      flash.now.notice = @route.errors.full_messages.first
    end
  end

  # Routeのルート表示区分を更新
  def visible
    route_param = params[:route_param]

    @route = Route.find(route_param[:routeId])
    @route.visible = route_param[:visible]
    if @route.save
      render json: { result: 'Success' }
    else
      render json: { result: 'Failure' }
    end
  end

  # Routeの並び順を更新
  def order
    route_param = params[:route_param]

    route_param[:routeIds].each_with_index do |route_id, index|
      @route = Route.find(route_id)
      @route.order = index + 1
      unless @route.save
        render json: { result: 'Failure' }
        return
      end
    end

    render json: { result: 'Success' }
  end

  private

  # User情報を取得
  def set_user
    @user = current_user

    # 未ログインの場合
    return if @user
    # ユーザートークンが保持されている場合
    return unless (user_token = get_cookies_value(:user_token))

    # ユーザートークンからユーザーを取得
    @user = User.find_by(user_token:)
  end

  # Route情報を取得
  def set_route
    @route = @user.routes.find(params[:id])
  end

  # ルート登録時のストロングパラメータ
  def route_params_create
    params.require(:route).permit(:name, :user_id, :order)
  end

  # ルート登録時のストロングパラメータ
  def route_params_update
    params.require(:route).permit(:name)
  end

  # ルート上限数チェック。無効な場合、true
  def invalid_create_route
    Route.where(user_id: @user.id).count >= MAX_ROUTE && !@user.admin
  end
end
